import { Alert, Property, Tenant, Transaction, EnergyBill, WaterBill } from '../types';

// Cache para evitar recálculos desnecessários de alertas com limite fixo
const alertCache = new Map<string, Alert[]>();
const MAX_CACHE_SIZE = 10;
const CACHE_CLEANUP_THRESHOLD = 8;
const _CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para limpar cache quando necessário (implementação LRU)
const cleanupAlertCache = (): void => {
  if (alertCache.size > CACHE_CLEANUP_THRESHOLD) {
    const keysToDelete = Array.from(alertCache.keys())
      .slice(0, alertCache.size - MAX_CACHE_SIZE);
    keysToDelete.forEach(key => alertCache.delete(key));
  }
};

// Geração otimizada de alertas automáticos
export const generateAutomaticAlerts = (
  properties: Property[],
  tenants: Tenant[],
  transactions: Transaction[],
  energyBills?: EnergyBill[],
  waterBills?: WaterBill[]
): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();

  // Cache baseado em hash dos dados de entrada
  const cacheKey = `alerts-${JSON.stringify({
    props: properties.map(p => `${p.id}-${p.status}`),
    tenants: tenants.map(t => `${t.id}-${t.status}`),
    trans: transactions.slice(-10).map(t => `${t.id}-${t.date}`), // Últimas 10 transações
    energy: energyBills?.slice(-5).map(b => `${b.id}-${b.date}`) || [],
    water: waterBills?.slice(-5).map(w => `${w.id}-${w.date}`) || []
  })}`;

  // Verificar cache
  if (alertCache.has(cacheKey)) {
    return alertCache.get(cacheKey)!;
  }

  // Criar mapas para lookup otimizado
  const tenantMap = new Map(tenants.map(t => [t.id, t]));
  const _propertyMap = new Map(properties.map(p => [p.id, p]));

  // Alertas de aluguel em atraso - otimizado
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const rentPayments = new Set(
    transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'income' && 
               t.category === 'Aluguel' &&
               transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      })
      .map(t => t.propertyId)
  );

  properties.forEach(property => {
    if (property.status === 'rented' && 
        property.tenant && 
        !rentPayments.has(property.id) && 
        now.getDate() > 10) {
      alerts.push({
        id: `rent_due_${property.id}`,
        type: 'rent_due',
        propertyId: property.id,
        tenantId: property.tenant.id,
        tenantName: property.tenant.name,
        message: `Aluguel de ${property.name} em atraso`,
        date: now,
        priority: 'high',
        resolved: false
      });
    }
  });

  // Alertas de contas de energia pendentes - com validação defensiva
  if (energyBills && Array.isArray(energyBills)) {
    energyBills.forEach(bill => {
      if (bill?.propertiesInGroup && Array.isArray(bill.propertiesInGroup)) {
        bill.propertiesInGroup.forEach((property: any) => {
          if (property && 
              !property.isPaid && 
              property.dueDate && 
              new Date(property.dueDate) < now) {
            const tenant = tenantMap.get(property.tenantId);
            
            alerts.push({
              id: `energy_bill_pending_${property.id}_${bill.id}`,
              type: 'energy_bill_pending',
              propertyId: property.propertyId || '',
              tenantId: property.tenantId,
              tenantName: property.tenantName || tenant?.name,
              message: `Conta de energia de ${property.name} vencida - ${property.tenantName || 'Inquilino não identificado'}`,
              date: now,
              priority: 'high',
              resolved: false
            });
          }
        });
      }
    });
  }
  
  // Alertas de contas de água pendentes - com validação defensiva
  if (waterBills && Array.isArray(waterBills)) {
    waterBills.forEach(bill => {
      if (bill?.propertiesInGroup && Array.isArray(bill.propertiesInGroup)) {
        bill.propertiesInGroup.forEach((property: any) => {
          if (property && 
              !property.isPaid && 
              property.dueDate && 
              new Date(property.dueDate) < now) {
            const tenant = tenantMap.get(property.tenantId);
            
            alerts.push({
              id: `water_bill_pending_${property.id}_${bill.id}`,
              type: 'water_bill_pending',
              propertyId: property.propertyId || '',
              tenantId: property.tenantId,
              tenantName: property.tenantName || tenant?.name,
              message: `Conta de água de ${property.name} vencida - ${property.tenantName || 'Inquilino não identificado'}`,
              date: now,
              priority: 'high',
              resolved: false
            });
          }
        });
      }
    });
  }
  
  // Alertas de manutenção - otimizado
  const maintenanceProperties = properties.filter(p => p.status === 'maintenance');
  maintenanceProperties.forEach(property => {
    alerts.push({
      id: `maintenance_${property.id}`,
      type: 'maintenance',
      propertyId: property.id,
      message: `${property.name} necessita de manutenção`,
      date: now,
      priority: 'medium',
      resolved: false
    });
  });

  // Alertas de impostos - otimizado
  const currentYearTaxPayments = new Set(
    transactions
      .filter(t => 
        t.type === 'expense' &&
        t.category === 'Impostos' &&
        new Date(t.date).getFullYear() === currentYear
      )
      .map(t => t.propertyId)
  );

  if (now.getMonth() >= 2) { // Março em diante
    properties.forEach(property => {
      if (!currentYearTaxPayments.has(property.id)) {
        alerts.push({
          id: `tax_due_${property.id}`,
          type: 'tax_due',
          propertyId: property.id,
          message: `Impostos de ${property.name} podem estar em atraso`,
          date: now,
          priority: 'medium',
          resolved: false
        });
      }
    });
  }

  // Cache o resultado e limpa cache antigo
  alertCache.set(cacheKey, alerts);
  cleanupAlertCache();

  return alerts;
};

// Processamento otimizado de transações recorrentes
export const processRecurringTransactions = (transactions: Transaction[]): Transaction[] => {
  const now = new Date();
  const recurringTransactions: Transaction[] = [];

  // Validação defensiva para array de transações
  if (!Array.isArray(transactions)) {
    console.warn('[processRecurringTransactions] Transactions não é um array:', transactions);
    return [];
  }

  // Filtrar apenas transações recorrentes vencidas
  const overdueRecurring = transactions.filter(t => 
    t && t.recurring && t.recurring.nextDate <= now
  );

  overdueRecurring.forEach(transaction => {
    if (transaction.recurring) {
      const { frequency, nextDate } = transaction.recurring;
      
      // Criar nova transação recorrente
      const newDate = new Date(nextDate);
      
      switch (frequency) {
        case 'monthly':
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case 'quarterly':
          newDate.setMonth(newDate.getMonth() + 3);
          break;
        case 'yearly':
          newDate.setFullYear(newDate.getFullYear() + 1);
          break;
      }

      recurringTransactions.push({
        ...transaction,
        id: `${transaction.id}_recurring_${now.getTime()}`,
        date: now,
        recurring: {
          frequency,
          nextDate: newDate
        }
      });
    }
  });

  return recurringTransactions;
};

// Função para limpar cache de alertas
export const clearAlertCache = (): void => {
  alertCache.clear();
};

// Função para obter métricas do cache de alertas
export const getAlertCacheMetrics = (): { alertCacheSize: number; cacheKeys: string[] } => {
  return {
    alertCacheSize: alertCache.size,
    cacheKeys: Array.from(alertCache.keys())
  };
};