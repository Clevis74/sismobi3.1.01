import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SkipLinks } from './components/common/SkipLinks';
import { NotificationProvider, useBackupAlerts } from './components/common/NotificationSystem';
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

// Componente interno que usa os hooks
const AppContent: React.FC = () => {
  useRenderMonitor('App');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showValues, setShowValues] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Hooks de backup com sistema de notificações
  const backupAlerts = useBackupAlerts();
  
  // Usar hook otimizado para localStorage
  const [properties, setProperties] = useOptimizedLocalStorage<Property[]>('properties', []);
  const [tenants, setTenants] = useOptimizedLocalStorage<Tenant[]>('tenants', []);
  const [transactions, setTransactions] = useOptimizedLocalStorage<Transaction[]>('transactions', []);
  const [alerts, setAlerts] = useOptimizedLocalStorage<Alert[]>('alerts', []);
  const [documents, setDocuments] = useOptimizedLocalStorage<Document[]>('documents', []);
  const [energyBills, setEnergyBills] = useOptimizedLocalStorage<EnergyBill[]>('energyBills', []);
  const [waterBills, setWaterBills] = useOptimizedLocalStorage<WaterBill[]>('waterBills', []);

  // Refs para dependências estáveis
  const stablePropertiesRef = useRef<Property[]>([]);
  const stableTransactionsRef = useRef<Transaction[]>([]);
  
  // Atualizar refs apenas quando dados mudarem estruturalmente
  useEffect(() => {
    const propsStringified = JSON.stringify(properties);
    const transStringified = JSON.stringify(transactions);
    const stablePropsStringified = JSON.stringify(stablePropertiesRef.current);
    const stableTransStringified = JSON.stringify(stableTransactionsRef.current);
    
    if (propsStringified !== stablePropsStringified) {
      stablePropertiesRef.current = properties;
    }
    if (transStringified !== stableTransStringified) {
      stableTransactionsRef.current = transactions;
    }
  }, [properties, transactions]);

  // Hash para dependências estáveis do useMemo
  const propertiesHash = useMemo(() => {
    return properties.map(p => `${p.id}-${p.status}-${p.rentValue}`).join('|');
  }, [properties]);
  
  const transactionsHash = useMemo(() => {
    return transactions.map(t => {
      const dateTime = t.date instanceof Date ? t.date.getTime() : new Date(t.date).getTime();
      return `${t.id}-${t.amount}-${isNaN(dateTime) ? '0' : dateTime}`;
    }).join('|');
  }, [transactions]);

  // Outros hashes para dependências complexas
  const tenantsHash = useMemo(() => {
    return tenants.map(t => `${t.id}-${t.propertyId}-${t.status}`).join('|');
  }, [tenants]);

  const energyBillsHash = useMemo(() => {
    return energyBills.map(b => `${b.id}-${b.groupId}`).join('|');
  }, [energyBills]);

  const waterBillsHash = useMemo(() => {
    return waterBills.map(b => `${b.id}-${b.groupId}`).join('|');
  }, [waterBills]);

  // Summary com dependências estáveis
  const summary = useMemo(() => {
    performanceMonitor.startTimer('financial-calculation');
    const result = calculateFinancialSummary(stablePropertiesRef.current, stableTransactionsRef.current);
    performanceMonitor.endTimer('financial-calculation');
    return result;
  }, [propertiesHash, transactionsHash]);

  // Alertas automáticos com dependências hash
  const automaticAlerts = useMemo(() => {
    performanceMonitor.startTimer('alert-generation');
    const result = generateAutomaticAlerts(
      stablePropertiesRef.current, 
      tenants, 
      stableTransactionsRef.current, 
      energyBills, 
      waterBills
    );
    performanceMonitor.endTimer('alert-generation');
    return result;
  }, [propertiesHash, transactionsHash, tenantsHash, energyBillsHash, waterBillsHash]);

  // Transações recorrentes com dependências hash
  const recurringTransactions = useMemo(() => {
    performanceMonitor.startTimer('recurring-transactions');
    const result = processRecurringTransactions(stableTransactionsRef.current);
    performanceMonitor.endTimer('recurring-transactions');
    return result;
  }, [transactionsHash]);

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

  // Callbacks para energy bills
  const addEnergyBill = useCallback((billData: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'>) => {
    const newBill: EnergyBill = {
      ...billData,
      id: Date.now().toString(),
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    setEnergyBills(prev => [...prev, newBill]);
  }, [setEnergyBills]);

  const updateEnergyBill = useCallback((id: string, updates: Partial<EnergyBill>) => {
    setEnergyBills(prev => prev.map(bill => 
      bill.id === id 
        ? { ...bill, ...updates, lastUpdated: new Date() }
        : bill
    ));
  }, [setEnergyBills]);

  const deleteEnergyBill = useCallback((id: string) => {
    setEnergyBills(prev => prev.filter(bill => bill.id !== id));
  }, [setEnergyBills]);

  // Callbacks para water bills
  const addWaterBill = useCallback((billData: Omit<WaterBill, 'id' | 'createdAt' | 'lastUpdated'>) => {
    const newBill: WaterBill = {
      ...billData,
      id: Date.now().toString(),
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    setWaterBills(prev => [...prev, newBill]);
  }, [setWaterBills]);

  const updateWaterBill = useCallback((id: string, updates: Partial<WaterBill>) => {
    setWaterBills(prev => prev.map(bill => 
      bill.id === id 
        ? { ...bill, ...updates, lastUpdated: new Date() }
        : bill
    ));
  }, [setWaterBills]);

  const deleteWaterBill = useCallback((id: string) => {
    setWaterBills(prev => prev.filter(bill => bill.id !== id));
  }, [setWaterBills]);

  // Callbacks para backup com sistema de notificações
  const handleExport = useCallback(() => {
    try {
      const backup = createBackup(properties, tenants, transactions, alerts, documents, energyBills, waterBills);
      exportBackup(backup);
      // Não mostra notificação de sucesso aqui pois o download é automático
    } catch (error) {
      backupAlerts.importError('Erro ao criar backup');
    }
  }, [properties, tenants, transactions, alerts, documents, energyBills, waterBills, backupAlerts]);

  const handleImport = useCallback(() => {
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
            backupAlerts.importSuccess();
          } else {
            backupAlerts.invalidFile();
          }
        } catch (error) {
          backupAlerts.importError(error instanceof Error ? error.message : 'Erro desconhecido');
        }
      }
    };
    input.click();
  }, [setProperties, setTenants, setTransactions, setAlerts, setDocuments, setEnergyBills, setWaterBills, backupAlerts]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <OptimizedDashboard summary={summary} properties={properties} transactions={transactions} showValues={showValues} />;
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
          <OptimizedTenantManager
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
        return <OptimizedDashboard summary={summary} properties={properties} transactions={transactions} showValues={showValues} />;
    }
  };

  return (
    <>
      <SkipLinks />
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block fixed lg:relative z-30 w-64 h-full`}>
          <ErrorBoundary fallback={<div className="p-4 text-red-600">Erro no menu lateral</div>}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </ErrorBoundary>
        </div>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            role="button"
            aria-label="Fechar menu"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsMobileMenuOpen(false);
              }
            }}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <ErrorBoundary fallback={<div className="p-4 text-red-600">Erro no cabeçalho</div>}>
            <Header 
              onExport={handleExport} 
              onImport={handleImport} 
              showValues={showValues}
              onToggleValues={() => setShowValues(!showValues)}
            />
          </ErrorBoundary>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="sr-only">Menu de navegação</span>
          </button>

          <main id="main-content" className="flex-1 p-6 overflow-y-auto" role="main">
            <ErrorBoundary>
              {renderContent()}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
};

// Componente principal com providers
function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;