import { Alert, Property, Tenant, Transaction, WaterBill } from '../types';

// Cache para alertas já processados
const alertCache = new Map<string, Alert[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para criar chave de cache baseada nos dados
const createAlertCacheKey = (
  properties: Property[],
  tenants: Tenant[],
  transactions: Transaction[],
  energyBills?: any[],
  waterBills?: WaterBill[]
) => {
  const propHash = properties.map(p => `${p.id}-${p.status}`).join('|');
  const tenantHash = tenants.map(t => `${t.id}-${t.status}`).join('|');
  const transHash = transactions.slice(-10).map(t => `${t.id}-${t.date}`).join('|'); // Últimas 10 transações
  const energyHash = energyBills?.slice(-5).map(b => `${b.id}-${b.isPaid}`).join('|') || '';
  const waterHash = waterBills?.slice(-5).map(b => `${b.id}-${b.isPaid}`).join('|') || '';
  
  return `${propHash}:${tenantHash}:${transHash}:${energyHash}:${waterHash}`;
};

// Geração otimizada de alertas com cache e processamento eficiente
export const generateAutomaticAlerts = (
  properties: Property[],
  tenants: Tenant[],
  transactions: Transaction[],
  energyBills?: any[],
  waterBills?: WaterBill[]
): Alert[] => {
  const cacheKey = createAlertCacheKey(properties, tenants, transactions, energyBills, waterBills);
  
  // Verificar cache
  if (alertCache.has(cacheKey)) {
    const cached = alertCache.get(cacheKey);
    if (cached) return cached;
  }

  const alerts: Alert[] = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Criar mapas para evitar loops aninhados
  const tenantMap = new Map(tenants.map(t => [t.id, t]));
  const propertyMap = new Map(properties.map(p => [p.id, p]));
  
  // Pré-filtrar transações do mês atual
  const monthlyIncomeTransactions = transactions.filter(t => 
    t.type === 'income' && 
    t.category === 'Aluguel' &&
    new Date(t.date).getMonth() === currentMonth &&
    new Date(t.date).getFullYear() === currentYear
  );

  // Criar set de propriedades com pagamento de aluguel
  const propertiesWithRentPayment = new Set(
    monthlyIncomeTransactions.map(t => t.propertyId)
  );

  // Alertas de aluguel em atraso - processamento otimizado
  properties.forEach(property => {
    if (property.status === 'rented' && property.tenant) {
      const hasRentPayment = propertiesWithRentPayment.has(property.id);
      
      if (!hasRentPayment && now.getDate() > 10) {
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
    }
  });

  // Alertas de contas de energia - processamento otimizado
  if (energyBills && energyBills.length > 0) {
    energyBills.forEach(bill => {
      if (bill?.propertiesInGroup && Array.isArray(bill.propertiesInGroup)) {
        bill.propertiesInGroup.forEach((property: any) => {
          if (!property.isPaid && property.dueDate && new Date(property.dueDate) < now) {
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
  
  // Alertas de contas de água - processamento otimizado
  if (waterBills && waterBills.length > 0) {
    waterBills.forEach(bill => {
      if (bill?.propertiesInGroup && Array.isArray(bill.propertiesInGroup)) {
        bill.propertiesInGroup.forEach((property: any) => {
          if (!property.isPaid && property.dueDate && new Date(property.dueDate) < now) {
            const tenant = tenantMap.get(property.tenantId);
            
            alerts.push({
              id: `water_bill_pending_${property.id}_${bill.id}`,
              type: 'energy_bill_pending',
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
  
  // Alertas de manutenção - processamento direto
  properties.forEach(property => {
    if (property.status === 'maintenance') {
      alerts.push({
        id: `maintenance_${property.id}`,
        type: 'maintenance',
        propertyId: property.id,
        message: `${property.name} necessita de manutenção`,
        date: now,
        priority: 'medium',
        resolved: false
      });
    }
  });

  // Alertas de impostos - processamento otimizado
  if (now.getMonth() >= 2) { // Março em diante
    const annualTaxTransactions = new Set(
      transactions
        .filter(t => 
          t.type === 'expense' && 
          t.category === 'Impostos' &&
          new Date(t.date).getFullYear() === now.getFullYear()
        )
        .map(t => t.propertyId)
    );

    properties.forEach(property => {
      if (!annualTaxTransactions.has(property.id)) {
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

  // Armazenar no cache
  alertCache.set(cacheKey, alerts);
  
  // Limpar cache antigo
  if (alertCache.size > 5) {
    const firstKey = alertCache.keys().next().value;
    alertCache.delete(firstKey);
  }

  return alerts;
};

// Processamento otimizado de transações recorrentes
export const processRecurringTransactions = (transactions: Transaction[]): Transaction[] => {
  const now = new Date();
  const recurringTransactions: Transaction[] = [];

  // Processar apenas transações com recurring definido
  const transactionsWithRecurring = transactions.filter(t => t.recurring);
  
  transactionsWithRecurring.forEach(transaction => {
    const { frequency, nextDate } = transaction.recurring!;
    
    if (nextDate <= now) {
      let newDate = new Date(nextDate);
      
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
export const clearAlertCache = () => {
  alertCache.clear();
};

// Função para obter métricas de performance dos alertas
export const getAlertPerformanceMetrics = () => {
  return {
    alertCacheSize: alertCache.size,
    cacheKeys: Array.from(alertCache.keys())
  };
};