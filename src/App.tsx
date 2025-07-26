import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { OptimizedDashboard } from './components/Dashboard/OptimizedDashboard';
import { PropertyManager } from './components/Properties/PropertyManager';
import { OptimizedTenantManager } from './components/Tenants/OptimizedTenantManager';
import { TransactionManager } from './components/Transactions/TransactionManager';
import { AlertManager } from './components/Alerts/AlertManager';
import { ReportManager } from './components/Reports/ReportManager';
import { DocumentManager } from './components/Documents/DocumentManager';
import { EnergyCalculator } from './components/Energy/EnergyCalculator';
import { WaterCalculator } from './components/Water/WaterCalculator';
import { useOptimizedLocalStorage } from './hooks/useOptimizedLocalStorage';
import { calculateFinancialSummary, clearCalculationCache } from './utils/optimizedCalculations';
import { generateAutomaticAlerts, processRecurringTransactions, clearAlertCache } from './utils/optimizedAlerts';
import { createBackup, exportBackup, importBackup, validateBackup, BackupData } from './utils/dataBackup';
import { useRenderMonitor, performanceMonitor } from './utils/performanceMonitor';
import { Property, Tenant, Transaction, Alert, Document, EnergyBill, WaterBill } from './types';

function App() {
  useRenderMonitor('App');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showValues, setShowValues] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Usar hook otimizado para localStorage
  const [properties, setProperties] = useOptimizedLocalStorage<Property[]>('properties', []);
  const [tenants, setTenants] = useOptimizedLocalStorage<Tenant[]>('tenants', []);
  const [transactions, setTransactions] = useOptimizedLocalStorage<Transaction[]>('transactions', []);
  const [alerts, setAlerts] = useOptimizedLocalStorage<Alert[]>('alerts', []);
  const [documents, setDocuments] = useOptimizedLocalStorage<Document[]>('documents', []);
  const [energyBills, setEnergyBills] = useOptimizedLocalStorage<EnergyBill[]>('energyBills', []);
  const [waterBills, setWaterBills] = useOptimizedLocalStorage<WaterBill[]>('waterBills', []);

  // Memoizar cálculo financeiro
  const summary = useMemo(() => {
    performanceMonitor.startTimer('financial-calculation');
    const result = calculateFinancialSummary(properties, transactions);
    performanceMonitor.endTimer('financial-calculation');
    return result;
  }, [properties, transactions]);

  // Memoizar geração de alertas automáticos
  const automaticAlerts = useMemo(() => {
    performanceMonitor.startTimer('alert-generation');
    const result = generateAutomaticAlerts(properties, tenants, transactions, energyBills, waterBills);
    performanceMonitor.endTimer('alert-generation');
    return result;
  }, [properties, tenants, transactions, energyBills, waterBills]);

  // Memoizar processamento de transações recorrentes
  const recurringTransactions = useMemo(() => {
    performanceMonitor.startTimer('recurring-transactions');
    const result = processRecurringTransactions(transactions);
    performanceMonitor.endTimer('recurring-transactions');
    return result;
  }, [transactions]);

  // Efeito otimizado para alertas automáticos
  useEffect(() => {
    if (automaticAlerts.length > 0) {
      const existingAlertIds = new Set(alerts.map(a => a.id));
      const newAlerts = automaticAlerts.filter(a => !existingAlertIds.has(a.id));
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts]);
      }
    }
  }, [automaticAlerts, alerts, setAlerts]);

  // Efeito otimizado para transações recorrentes
  useEffect(() => {
    if (recurringTransactions.length > 0) {
      setTransactions(prev => [...prev, ...recurringTransactions]);
    }
  }, [recurringTransactions, setTransactions]);

  // Limpar cache periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      clearCalculationCache();
      clearAlertCache();
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, []);

  // Callbacks memoizados para funções de propriedades
  const addProperty = useCallback((propertyData: Omit<Property, 'id' | 'createdAt'>) => {
    const newProperty: Property = {
      ...propertyData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setProperties(prev => [...prev, newProperty]);
  }, [setProperties]);

  const updateProperty = useCallback((id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setProperties]);

  const deleteProperty = useCallback((id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    setTransactions(prev => prev.filter(t => t.propertyId !== id));
  }, [setProperties, setTransactions]);

  // Callbacks memoizados para funções de inquilinos
  const addTenant = useCallback((tenantData: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = {
      ...tenantData,
      id: Date.now().toString()
    };
    setTenants(prev => [...prev, newTenant]);
    
    if (tenantData.propertyId) {
      setProperties(prev => prev.map(property => 
        property.id === tenantData.propertyId 
          ? { ...property, tenant: newTenant, status: 'rented' as const }
          : property
      ));
    }
  }, [setTenants, setProperties]);

  const updateTenant = useCallback((id: string, updates: Partial<Tenant>) => {
    setTenants(prev => {
      const oldTenant = prev.find(t => t.id === id);
      const updatedTenant = { ...oldTenant, ...updates } as Tenant;
      
      setProperties(prevProps => prevProps.map(property => {
        if (oldTenant?.propertyId && oldTenant.propertyId !== updatedTenant.propertyId && property.id === oldTenant.propertyId) {
          return { ...property, tenant: undefined, status: 'vacant' as const };
        }
        
        if (property.id === updatedTenant.propertyId) {
          return { ...property, tenant: updatedTenant, status: 'rented' as const };
        }
        
        if (property.tenant?.id === id) {
          return { ...property, tenant: updatedTenant };
        }
        
        return property;
      }));
      
      return prev.map(t => t.id === id ? { ...t, ...updates } : t);
    });
  }, [setTenants, setProperties]);

  const deleteTenant = useCallback((id: string) => {
    setTenants(prev => {
      const tenant = prev.find(t => t.id === id);
      
      if (tenant?.propertyId) {
        setProperties(prevProps => prevProps.map(property => 
          property.id === tenant.propertyId 
            ? { ...property, tenant: undefined, status: 'vacant' as const }
            : property
        ));
      }
      
      return prev.filter(t => t.id !== id);
    });
  }, [setTenants, setProperties]);

  // Callbacks memoizados para outras funções
  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString()
    };
    setTransactions(prev => [...prev, newTransaction]);
  }, [setTransactions]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [setTransactions]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }, [setAlerts]);

  const deleteAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, [setAlerts]);

  const addDocument = useCallback((documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    const newDocument: Document = {
      ...documentData,
      id: Date.now().toString(),
      lastUpdated: new Date()
    };
    setDocuments(prev => [...prev, newDocument]);
  }, [setDocuments]);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    setDocuments(prev => prev.map(d => 
      d.id === id 
        ? { ...d, ...updates, lastUpdated: new Date() }
        : d
    ));
  }, [setDocuments]);

  const deleteDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, [setDocuments]);

  // Funções para gerenciar contas de energia
  const addEnergyBill = (billData: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'>) => {
    const newBill: EnergyBill = {
      ...billData,
      id: Date.now().toString(),
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    setEnergyBills(prev => [...prev, newBill]);
  };

  const updateEnergyBill = (id: string, updates: Partial<EnergyBill>) => {
    setEnergyBills(prev => prev.map(bill => 
      bill.id === id 
        ? { ...bill, ...updates, lastUpdated: new Date() }
        : bill
    ));
  };

  const deleteEnergyBill = (id: string) => {
    setEnergyBills(prev => prev.filter(bill => bill.id !== id));
  };

  // Funções para gerenciar contas de água
  const addWaterBill = (billData: Omit<WaterBill, 'id' | 'createdAt' | 'lastUpdated'>) => {
    const newBill: WaterBill = {
      ...billData,
      id: Date.now().toString(),
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    setWaterBills(prev => [...prev, newBill]);
  };

  const updateWaterBill = (id: string, updates: Partial<WaterBill>) => {
    setWaterBills(prev => prev.map(bill => 
      bill.id === id 
        ? { ...bill, ...updates, lastUpdated: new Date() }
        : bill
    ));
  };

  const deleteWaterBill = (id: string) => {
    setWaterBills(prev => prev.filter(bill => bill.id !== id));
  };

  // Funções para backup
  const handleExport = () => {
    const backup = createBackup(properties, tenants, transactions, alerts, documents, energyBills, waterBills);
    exportBackup(backup);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const backupData = await importBackup(file);
          if (validateBackup(backupData)) {
            setProperties(backupData.properties);
            setTenants(backupData.tenants);
            setTransactions(backupData.transactions);
            setAlerts(backupData.alerts);
            setDocuments(backupData.documents || []);
            setEnergyBills(backupData.energyBills || []);
            setWaterBills(backupData.waterBills || []);
            alert('Backup importado com sucesso!');
          } else {
            alert('Arquivo de backup inválido!');
          }
        } catch (error) {
          alert('Erro ao importar backup: ' + error);
        }
      }
    };
    input.click();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard summary={summary} properties={properties} transactions={transactions} showValues={showValues} />;
      case 'properties':
        return (
          <PropertyManager
            properties={properties}
            showValues={showValues}
            onAddProperty={addProperty}
            onUpdateProperty={updateProperty}
            onDeleteProperty={deleteProperty}
          />
        );
      case 'tenants':
        return (
          <TenantManager
            tenants={tenants}
            properties={properties}
            showValues={showValues}
            onAddTenant={addTenant}
            onUpdateTenant={updateTenant}
            onDeleteTenant={deleteTenant}
          />
        );
      case 'transactions':
        return (
          <TransactionManager
            transactions={transactions}
            properties={properties}
            showValues={showValues}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        );
      case 'alerts':
        return (
          <AlertManager
            alerts={alerts}
            properties={properties}
            onResolveAlert={resolveAlert}
            onDeleteAlert={deleteAlert}
          />
        );
      case 'reports':
        return (
          <ReportManager
            properties={properties}
            transactions={transactions}
            summary={summary}
            showValues={showValues}
          />
        );
      case 'documents':
        return (
          <DocumentManager
            documents={documents}
            properties={properties}
            tenants={tenants}
            onAddDocument={addDocument}
            onUpdateDocument={updateDocument}
            onDeleteDocument={deleteDocument}
          />
        );
      case 'energy':
        return (
          <EnergyCalculator
            energyBills={energyBills}
            properties={properties}
            showValues={showValues}
            onAddEnergyBill={addEnergyBill}
            onUpdateEnergyBill={updateEnergyBill}
            onDeleteEnergyBill={deleteEnergyBill}
          />
        );
      case 'water':
        return (
          <WaterCalculator
            waterBills={waterBills}
            properties={properties}
            showValues={showValues}
            onAddWaterBill={addWaterBill}
            onUpdateWaterBill={updateWaterBill}
            onDeleteWaterBill={deleteWaterBill}
          />
        );
      default:
        return <Dashboard summary={summary} properties={properties} transactions={transactions} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block fixed lg:relative z-30 w-64 h-full`}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header 
          onExport={handleExport} 
          onImport={handleImport} 
          showValues={showValues}
          onToggleValues={() => setShowValues(!showValues)}
        />
        
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;