// Hooks específicos para cada tipo de dados usando a abordagem híbrida
import { useHybridData } from './useHybridData';
import { propertyService, tenantService, transactionService, alertService } from '../services/api';
import { Property, Tenant, Transaction, Alert, Document, EnergyBill, WaterBill } from '../types';

// Hook para propriedades
export function useProperties() {
  return useHybridData<Property[]>(
    'properties',
    [],
    {
      getAll: () => propertyService.getAll(),
      create: (item) => propertyService.create(item),
      update: (id, updates) => propertyService.update(id, updates),
      delete: (id) => propertyService.delete(id)
    },
    {
      syncInterval: 5 * 60 * 1000, // 5 minutos
      retryAttempts: 3,
      enableOfflineMode: true
    }
  );
}

// Hook para inquilinos
export function useTenants() {
  return useHybridData<Tenant[]>(
    'tenants',
    [],
    {
      getAll: () => tenantService.getAll(),
      create: (item) => tenantService.create(item),
      update: (id, updates) => tenantService.update(id, updates),
      delete: (id) => tenantService.delete(id)
    },
    {
      syncInterval: 5 * 60 * 1000,
      retryAttempts: 3,
      enableOfflineMode: true
    }
  );
}

// Hook para transações
export function useTransactions() {
  return useHybridData<Transaction[]>(
    'transactions',
    [],
    {
      getAll: () => transactionService.getAll(),
      create: (item) => transactionService.create(item),
      update: (id, updates) => transactionService.update(id, updates),
      delete: (id) => transactionService.delete(id)
    },
    {
      syncInterval: 2 * 60 * 1000, // 2 minutos (mais frequente para dados financeiros)
      retryAttempts: 5,
      enableOfflineMode: true
    }
  );
}

// Hook para alertas
export function useAlerts() {
  return useHybridData<Alert[]>(
    'alerts',
    [],
    {
      getAll: () => alertService.getAll(),
      create: (item) => alertService.create(item),
      update: (id, updates) => alertService.update(id, updates),
      delete: (id) => alertService.delete(id)
    },
    {
      syncInterval: 10 * 60 * 1000, // 10 minutos
      retryAttempts: 2,
      enableOfflineMode: true
    }
  );
}

// Hook para documentos (mantém localStorage por enquanto, já que não há API ainda)
export function useDocuments() {
  return useHybridData<Document[]>(
    'documents',
    [],
    {
      getAll: async () => {
        // Simula API que ainda não existe
        const stored = localStorage.getItem('documents');
        return stored ? JSON.parse(stored) : [];
      },
      create: async (item) => {
        const stored = localStorage.getItem('documents');
        const documents = stored ? JSON.parse(stored) : [];
        const newDoc = { ...item, id: Date.now().toString() };
        documents.push(newDoc);
        localStorage.setItem('documents', JSON.stringify(documents));
        return newDoc;
      },
      update: async (id, updates) => {
        const stored = localStorage.getItem('documents');
        const documents = stored ? JSON.parse(stored) : [];
        const index = documents.findIndex((d: Document) => d.id === id);
        if (index !== -1) {
          documents[index] = { ...documents[index], ...updates };
          localStorage.setItem('documents', JSON.stringify(documents));
        }
        return documents[index];
      },
      delete: async (id) => {
        const stored = localStorage.getItem('documents');
        const documents = stored ? JSON.parse(stored) : [];
        const filtered = documents.filter((d: Document) => d.id !== id);
        localStorage.setItem('documents', JSON.stringify(filtered));
      }
    },
    {
      syncInterval: 0, // Sem auto-sync para localStorage-only
      enableOfflineMode: true
    }
  );
}

// Hook para contas de energia (localStorage-only por enquanto)
export function useEnergyBills() {
  return useHybridData<EnergyBill[]>(
    'energyBills',
    [],
    {
      getAll: async () => {
        const stored = localStorage.getItem('energyBills');
        return stored ? JSON.parse(stored) : [];
      },
      create: async (item) => {
        const stored = localStorage.getItem('energyBills');
        const bills = stored ? JSON.parse(stored) : [];
        const newBill = { ...item, id: Date.now().toString(), createdAt: new Date(), lastUpdated: new Date() };
        bills.push(newBill);
        localStorage.setItem('energyBills', JSON.stringify(bills));
        return newBill;
      },
      update: async (id, updates) => {
        const stored = localStorage.getItem('energyBills');
        const bills = stored ? JSON.parse(stored) : [];
        const index = bills.findIndex((b: EnergyBill) => b.id === id);
        if (index !== -1) {
          bills[index] = { ...bills[index], ...updates, lastUpdated: new Date() };
          localStorage.setItem('energyBills', JSON.stringify(bills));
        }
        return bills[index];
      },
      delete: async (id) => {
        const stored = localStorage.getItem('energyBills');
        const bills = stored ? JSON.parse(stored) : [];
        const filtered = bills.filter((b: EnergyBill) => b.id !== id);
        localStorage.setItem('energyBills', JSON.stringify(filtered));
      }
    },
    {
      syncInterval: 0,
      enableOfflineMode: true
    }
  );
}

// Hook para contas de água (localStorage-only por enquanto)
export function useWaterBills() {
  return useHybridData<WaterBill[]>(
    'waterBills',
    [],
    {
      getAll: async () => {
        const stored = localStorage.getItem('waterBills');
        return stored ? JSON.parse(stored) : [];
      },
      create: async (item) => {
        const stored = localStorage.getItem('waterBills');
        const bills = stored ? JSON.parse(stored) : [];
        const newBill = { ...item, id: Date.now().toString(), createdAt: new Date(), lastUpdated: new Date() };
        bills.push(newBill);
        localStorage.setItem('waterBills', JSON.stringify(bills));
        return newBill;
      },
      update: async (id, updates) => {
        const stored = localStorage.getItem('waterBills');
        const bills = stored ? JSON.parse(stored) : [];
        const index = bills.findIndex((b: WaterBill) => b.id === id);
        if (index !== -1) {
          bills[index] = { ...bills[index], ...updates, lastUpdated: new Date() };
          localStorage.setItem('waterBills', JSON.stringify(bills));
        }
        return bills[index];
      },
      delete: async (id) => {
        const stored = localStorage.getItem('waterBills');
        const bills = stored ? JSON.parse(stored) : [];
        const filtered = bills.filter((b: WaterBill) => b.id !== id);
        localStorage.setItem('waterBills', JSON.stringify(filtered));
      }
    },
    {
      syncInterval: 0,
      enableOfflineMode: true
    }
  );
}