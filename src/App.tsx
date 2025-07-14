import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PropertyManager } from './components/Properties/PropertyManager';
import { TenantManager } from './components/Tenants/TenantManager';
import { TransactionManager } from './components/Transactions/TransactionManager';
import { AlertManager } from './components/Alerts/AlertManager';
import { ReportManager } from './components/Reports/ReportManager';
import { DocumentManager } from './components/Documents/DocumentManager';
import { useLocalStorage } from './hooks/useLocalStorage';
import { calculateFinancialSummary } from './utils/calculations';
import { generateAutomaticAlerts, processRecurringTransactions } from './utils/alerts';
import { createBackup, exportBackup, importBackup, validateBackup, BackupData } from './utils/dataBackup';
import { Property, Tenant, Transaction, Alert, Document } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useLocalStorage<Property[]>('properties', []);
  const [tenants, setTenants] = useLocalStorage<Tenant[]>('tenants', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [alerts, setAlerts] = useLocalStorage<Alert[]>('alerts', []);
  const [documents, setDocuments] = useLocalStorage<Document[]>('documents', []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Gerar alertas automáticos
  useEffect(() => {
    const automaticAlerts = generateAutomaticAlerts(properties, tenants, transactions);
    const existingAlertIds = alerts.map(a => a.id);
    const newAlerts = automaticAlerts.filter(a => !existingAlertIds.includes(a.id));
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
  }, [properties, tenants, transactions]);

  // Processar transações recorrentes
  useEffect(() => {
    const recurringTransactions = processRecurringTransactions(transactions);
    if (recurringTransactions.length > 0) {
      setTransactions(prev => [...prev, ...recurringTransactions]);
    }
  }, [transactions]);

  const summary = calculateFinancialSummary(properties, transactions);

  // Funções para gerenciar propriedades
  const addProperty = (propertyData: Omit<Property, 'id' | 'createdAt'>) => {
    const newProperty: Property = {
      ...propertyData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setProperties(prev => [...prev, newProperty]);
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    setTransactions(prev => prev.filter(t => t.propertyId !== id));
  };

  // Funções para gerenciar inquilinos
  const addTenant = (tenantData: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = {
      ...tenantData,
      id: Date.now().toString()
    };
    setTenants(prev => [...prev, newTenant]);
    
    // Atualizar a propriedade vinculada
    if (tenantData.propertyId) {
      setProperties(prev => prev.map(property => 
        property.id === tenantData.propertyId 
          ? { ...property, tenant: newTenant, status: 'rented' as const }
          : property
      ));
    }
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    const oldTenant = tenants.find(t => t.id === id);
    const updatedTenant = { ...oldTenant, ...updates } as Tenant;
    
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    
    // Gerenciar vínculos de propriedades
    setProperties(prev => prev.map(property => {
      // Remover vínculo da propriedade antiga se mudou
      if (oldTenant?.propertyId && oldTenant.propertyId !== updatedTenant.propertyId && property.id === oldTenant.propertyId) {
        return { ...property, tenant: undefined, status: 'vacant' as const };
      }
      
      // Adicionar vínculo à nova propriedade
      if (property.id === updatedTenant.propertyId) {
        return { ...property, tenant: updatedTenant, status: 'rented' as const };
      }
      
      // Atualizar dados do inquilino na propriedade atual se não mudou de propriedade
      if (property.tenant?.id === id) {
        return { ...property, tenant: updatedTenant };
      }
      
      return property;
    }));
  };

  const deleteTenant = (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    setTenants(prev => prev.filter(t => t.id !== id));
    
    // Remover vínculo da propriedade
    if (tenant?.propertyId) {
      setProperties(prev => prev.map(property => 
        property.id === tenant.propertyId 
          ? { ...property, tenant: undefined, status: 'vacant' as const }
          : property
      ));
    }
  };

  // Funções para gerenciar transações
  const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString()
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Funções para gerenciar alertas
  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Funções para gerenciar documentos
  const addDocument = (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    const newDocument: Document = {
      ...documentData,
      id: Date.now().toString(),
      lastUpdated: new Date()
    };
    setDocuments(prev => [...prev, newDocument]);
  };

  const updateDocument = (id: string, updates: Partial<Document>) => {
    setDocuments(prev => prev.map(d => 
      d.id === id 
        ? { ...d, ...updates, lastUpdated: new Date() }
        : d
    ));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Funções para backup
  const handleExport = () => {
    const backup = createBackup(properties, tenants, transactions, alerts, documents);
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
        return <Dashboard summary={summary} properties={properties} transactions={transactions} />;
      case 'properties':
        return (
          <PropertyManager
            properties={properties}
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
        <Header onExport={handleExport} onImport={handleImport} />
        
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