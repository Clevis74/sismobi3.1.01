import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { SummaryModal } from './components/Summary/SummaryModal';
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
import { useProperties, useTenants, useTransactions, useAlerts, useDocuments, useEnergyBills, useWaterBills } from './hooks/useHybridServices';
import { calculateFinancialSummary, clearCalculationCache } from './utils/optimizedCalculations';
import { generateAutomaticAlerts, processRecurringTransactions, clearAlertCache } from './utils/optimizedAlerts';
import { createBackup, exportBackup, importBackup, validateBackup } from './utils/dataBackup';
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
  
  // Sistema híbrido: API + localStorage fallback
  const [propertiesState, propertiesActions] = useProperties();
  const [tenantsState, tenantsActions] = useTenants();
  const [transactionsState, transactionsActions] = useTransactions();
  const [alertsState, alertsActions] = useAlerts();
  const [documentsState, documentsActions] = useDocuments();
  const [energyBillsState, energyBillsActions] = useEnergyBills();
  const [waterBillsState, waterBillsActions] = useWaterBills();

  // Extrair dados dos estados híbridos
  const properties = propertiesState.data;
  const tenants = tenantsState.data;
  const transactions = transactionsState.data;
  const alerts = alertsState.data;
  const documents = documentsState.data;
  const energyBills = energyBillsState.data;
  const waterBills = waterBillsState.data;

  // Estado de loading geral
  const isLoading = propertiesState.loading || tenantsState.loading || transactionsState.loading;
  
  // Exibir erros não críticos
  useEffect(() => {
    const errors = [
      propertiesState.error,
      tenantsState.error,
      transactionsState.error,
      alertsState.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.warn('Avisos do sistema híbrido:', errors);
      // Aqui você pode adicionar notificações para o usuário se necessário
    }
  }, [propertiesState.error, tenantsState.error, transactionsState.error, alertsState.error]);

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
        // Criar novos alertas usando a API híbrida
        newAlerts.forEach(async (alert) => {
          try {
            await alertsActions.create(alert);
          } catch (error) {
            console.warn('Erro ao criar alerta automático:', error);
          }
        });
      }
    }
  }, [automaticAlerts, alerts, alertsActions]);

  // Efeito otimizado para transações recorrentes
  useEffect(() => {
    if (recurringTransactions.length > 0) {
      // Criar transações recorrentes usando a API híbrida
      recurringTransactions.forEach(async (transaction) => {
        try {
          await transactionsActions.create(transaction);
        } catch (error) {
          console.warn('Erro ao criar transação recorrente:', error);
        }
      });
    }
  }, [recurringTransactions, transactionsActions]);

  // Limpar cache periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      clearCalculationCache();
      clearAlertCache();
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, []);

  // Callbacks memoizados para funções de propriedades
  const addProperty = useCallback(async (propertyData: Omit<Property, 'id' | 'createdAt'>) => {
    try {
      const newProperty: Omit<Property, 'id'> = {
        ...propertyData,
        createdAt: new Date()
      };
      await propertiesActions.create(newProperty);
    } catch (error) {
      console.error('Erro ao adicionar propriedade:', error);
    }
  }, [propertiesActions]);

  const updateProperty = useCallback(async (id: string, updates: Partial<Property>) => {
    try {
      await propertiesActions.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar propriedade:', error);
    }
  }, [propertiesActions]);

  const deleteProperty = useCallback(async (id: string) => {
    try {
      await propertiesActions.delete(id);
      // Também limpar transações relacionadas
      const relatedTransactions = transactions.filter(t => t.propertyId === id);
      for (const transaction of relatedTransactions) {
        await transactionsActions.delete(transaction.id);
      }
    } catch (error) {
      console.error('Erro ao deletar propriedade:', error);
    }
  }, [propertiesActions, transactions, transactionsActions]);

  // Callbacks memoizados para funções de inquilinos
  const addTenant = useCallback(async (tenantData: Omit<Tenant, 'id'>) => {
    try {
      await tenantsActions.create(tenantData);
      
      // Atualizar propriedade se necessário
      if (tenantData.propertyId) {
        const property = properties.find(p => p.id === tenantData.propertyId);
        if (property) {
          await propertiesActions.update(property.id, { 
            status: 'rented' as const 
          });
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar inquilino:', error);
    }
  }, [tenantsActions, properties, propertiesActions]);

  const updateTenant = useCallback(async (id: string, updates: Partial<Tenant>) => {
    try {
      const oldTenant = tenants.find(t => t.id === id);
      await tenantsActions.update(id, updates);
      
      // Atualizar status das propriedades se necessário
      if (oldTenant) {
        // Propriedade antiga fica vaga
        if (oldTenant.propertyId && oldTenant.propertyId !== updates.propertyId) {
          await propertiesActions.update(oldTenant.propertyId, { 
            status: 'vacant' as const 
          });
        }
        
        // Nova propriedade fica ocupada
        if (updates.propertyId && updates.propertyId !== oldTenant.propertyId) {
          await propertiesActions.update(updates.propertyId, { 
            status: 'rented' as const 
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar inquilino:', error);
    }
  }, [tenantsActions, tenants, propertiesActions]);

  const deleteTenant = useCallback(async (id: string) => {
    try {
      const tenant = tenants.find(t => t.id === id);
      await tenantsActions.delete(id);
      
      // Marcar propriedade como vaga
      if (tenant?.propertyId) {
        await propertiesActions.update(tenant.propertyId, { 
          status: 'vacant' as const 
        });
      }
    } catch (error) {
      console.error('Erro ao deletar inquilino:', error);
    }
  }, [tenantsActions, tenants, propertiesActions]);

  // Callbacks memoizados para outras funções
  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      await transactionsActions.create(transactionData);
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
    }
  }, [transactionsActions]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      await transactionsActions.update(id, updates);
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
    }
  }, [transactionsActions]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await transactionsActions.delete(id);
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
    }
  }, [transactionsActions]);

  const resolveAlert = useCallback(async (id: string) => {
    try {
      await alertsActions.update(id, { resolved: true });
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  }, [alertsActions]);

  const deleteAlert = useCallback(async (id: string) => {
    try {
      await alertsActions.delete(id);
    } catch (error) {
      console.error('Erro ao deletar alerta:', error);
    }
  }, [alertsActions]);

  const addDocument = useCallback(async (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    try {
      const newDocument: Omit<Document, 'id'> = {
        ...documentData,
        lastUpdated: new Date()
      };
      await documentsActions.create(newDocument);
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
    }
  }, [documentsActions]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    try {
      const updatesWithTimestamp = {
        ...updates,
        lastUpdated: new Date()
      };
      await documentsActions.update(id, updatesWithTimestamp);
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
    }
  }, [documentsActions]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await documentsActions.delete(id);
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
    }
  }, [documentsActions]);

  // Callbacks para energy bills
  const addEnergyBill = useCallback(async (billData: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'>) => {
    try {
      const newBill: Omit<EnergyBill, 'id'> = {
        ...billData,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      await energyBillsActions.create(newBill);
    } catch (error) {
      console.error('Erro ao adicionar conta de energia:', error);
    }
  }, [energyBillsActions]);

  const updateEnergyBill = useCallback(async (id: string, updates: Partial<EnergyBill>) => {
    try {
      const updatesWithTimestamp = {
        ...updates,
        lastUpdated: new Date()
      };
      await energyBillsActions.update(id, updatesWithTimestamp);
    } catch (error) {
      console.error('Erro ao atualizar conta de energia:', error);
    }
  }, [energyBillsActions]);

  const deleteEnergyBill = useCallback(async (id: string) => {
    try {
      await energyBillsActions.delete(id);
    } catch (error) {
      console.error('Erro ao deletar conta de energia:', error);
    }
  }, [energyBillsActions]);

  // Callbacks para water bills
  const addWaterBill = useCallback(async (billData: Omit<WaterBill, 'id' | 'createdAt' | 'lastUpdated'>) => {
    try {
      const newBill: Omit<WaterBill, 'id'> = {
        ...billData,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      await waterBillsActions.create(newBill);
    } catch (error) {
      console.error('Erro ao adicionar conta de água:', error);
    }
  }, [waterBillsActions]);

  const updateWaterBill = useCallback(async (id: string, updates: Partial<WaterBill>) => {
    try {
      const updatesWithTimestamp = {
        ...updates,
        lastUpdated: new Date()
      };
      await waterBillsActions.update(id, updatesWithTimestamp);
    } catch (error) {
      console.error('Erro ao atualizar conta de água:', error);
    }
  }, [waterBillsActions]);

  const deleteWaterBill = useCallback(async (id: string) => {
    try {
      await waterBillsActions.delete(id);
    } catch (error) {
      console.error('Erro ao deletar conta de água:', error);
    }
  }, [waterBillsActions]);

  // Callbacks para backup com sistema de notificações
  const handleExport = useCallback(() => {
    try {
      const backup = createBackup(properties, tenants, transactions, alerts, documents, energyBills, waterBills);
      exportBackup(backup);
      // Não mostra notificação de sucesso aqui pois o download é automático
    } catch (_error) {
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
            // Para dados híbridos, precisamos usar os actions para criar novos itens
            // Por enquanto, vamos manter a lógica de backup/restore do localStorage
            // TODO: Implementar importação via API quando necessário
            
            // Fallback para localStorage direto
            localStorage.setItem('properties', JSON.stringify(backupData.properties));
            localStorage.setItem('tenants', JSON.stringify(backupData.tenants));
            localStorage.setItem('transactions', JSON.stringify(backupData.transactions));
            localStorage.setItem('alerts', JSON.stringify(backupData.alerts));
            localStorage.setItem('documents', JSON.stringify(backupData.documents || []));
            localStorage.setItem('energyBills', JSON.stringify(backupData.energyBills || []));
            localStorage.setItem('waterBills', JSON.stringify(backupData.waterBills || []));
            
            // Refresh todos os dados
            await propertiesActions.refresh();
            await tenantsActions.refresh();
            await transactionsActions.refresh();
            await alertsActions.refresh();
            await documentsActions.refresh();
            await energyBillsActions.refresh();
            await waterBillsActions.refresh();
            
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
  }, [backupAlerts, propertiesActions, tenantsActions, transactionsActions, alertsActions, documentsActions, energyBillsActions, waterBillsActions]);

  const renderContent = (): React.ReactElement => {
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

  const handleMobileMenuToggle = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleOverlayClick = (): void => {
    setIsMobileMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsMobileMenuOpen(false);
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
            onClick={handleOverlayClick}
            role="button"
            aria-label="Fechar menu"
            tabIndex={0}
            onKeyDown={handleKeyDown}
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
              connectionStatus={{
                isOnline: propertiesState.isOnline && transactionsState.isOnline,
                dataSource: propertiesState.source === 'api' || transactionsState.source === 'api' ? 'api' : 
                           propertiesState.source === 'localStorage' || transactionsState.source === 'localStorage' ? 'localStorage' : 'default',
                lastSync: propertiesState.lastSync || transactionsState.lastSync
              }}
            />
          </ErrorBoundary>
          
          {/* Mobile menu button */}
          <button
            onClick={handleMobileMenuToggle}
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
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner 
                    size="lg" 
                    text="Sincronizando dados..." 
                  />
                </div>
              ) : (
                renderContent()
              )}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
};

// Componente principal com providers
function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;