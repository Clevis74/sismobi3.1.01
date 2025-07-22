import { WaterPropertyConsumption, WaterBill, WaterGroup } from '../types';

// Grupos predefinidos para água conforme especificação
export const DEFAULT_WATER_GROUPS: WaterGroup[] = [
  {
    id: 'water-group1',
    name: '802-House',
    properties: ['802-Ca 01', '802-Ca 02', '802-Ca 03', '802-Ca 04', '802-Ca 05', '802-Ca 06']
  },
  {
    id: 'water-group2',
    name: '117-House',
    properties: ['117-Ca 01', '117-Ca 02', '117-Ca 03']
  },
  {
    id: 'water-group3',
    name: '119-House',
    properties: ['119-Ca 01', '119-Ca 02']
  }
];

/**
 * Valida se todos os campos de pessoas estão preenchidos
 */
export const validatePeopleData = (
  properties: WaterPropertyConsumption[]
): { isValid: boolean; message: string; missingProperties: string[] } => {
  const missingProperties = properties.filter(prop => prop.numberOfPeople <= 0).map(prop => prop.name);
  
  if (missingProperties.length > 0) {
    return {
      isValid: false,
      message: `Preencha o número de pessoas para: ${missingProperties.join(', ')}`,
      missingProperties
    };
  }

  return {
    isValid: true,
    message: 'Todos os campos estão preenchidos',
    missingProperties: []
  };
};

/**
 * Distribui a conta de água proporcionalmente entre os imóveis baseado no número de pessoas
 */
export const distributeWaterGroupBill = (
  groupTotalValue: number,
  properties: WaterPropertyConsumption[]
): WaterPropertyConsumption[] => {
  if (groupTotalValue === 0) {
    return properties.map(prop => ({
      ...prop,
      proportionalValue: 0
    }));
  }

  // Calcular total de pessoas no grupo
  const totalPeople = properties.reduce((sum, prop) => sum + prop.numberOfPeople, 0);
  
  if (totalPeople === 0) {
    return properties.map(prop => ({
      ...prop,
      proportionalValue: 0
    }));
  }

  // Calcular valor por pessoa
  const valuePerPerson = groupTotalValue / totalPeople;

  // Distribuir valores proporcionalmente
  return properties.map(prop => ({
    ...prop,
    proportionalValue: prop.numberOfPeople * valuePerPerson
  }));
};

/**
 * Cria uma nova propriedade de consumo de água
 */
export const createWaterPropertyConsumption = (
  name: string,
  groupId: string,
  propertyId?: string,
  tenantId?: string,
  tenantName?: string
): Omit<WaterPropertyConsumption, 'id'> => {
  // Calcular data de vencimento padrão (15 dias após a data atual)
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 15);

  return {
    name,
    propertyId,
    tenantId,
    tenantName,
    numberOfPeople: 0,
    proportionalValue: 0,
    groupId,
    isPaid: false,
    dueDate: defaultDueDate
  };
};

/**
 * Importa dados do mês anterior
 */
export const importPreviousWaterMonthData = (
  currentBill: WaterBill,
  previousBill: WaterBill | null
): WaterBill => {
  if (!previousBill || previousBill.groupId !== currentBill.groupId) {
    return currentBill;
  }

  const updatedProperties = currentBill.propertiesInGroup.map((prop: WaterPropertyConsumption) => {
    const previousProp = previousBill.propertiesInGroup.find(p => p.name === prop.name);
    if (previousProp) {
      return {
        ...prop,
        numberOfPeople: previousProp.numberOfPeople // Importar número de pessoas do mês anterior
      };
    }
    return prop;
  });

  return {
    ...currentBill,
    propertiesInGroup: updatedProperties
  };
};

/**
 * Gera insights baseados no histórico de contas de água
 */
export const generateWaterInsights = (
  currentBill: WaterBill,
  previousBills: WaterBill[],
  groupId: string
): string[] => {
  const insights: string[] = [];

  // Filtrar apenas contas do mesmo grupo
  const groupBills = previousBills.filter(bill => bill.groupId === groupId);
  
  if (groupBills.length === 0) return insights;

  const lastBill = groupBills[groupBills.length - 1];
  
  // Calcular totais consolidados
  const currentTotalPeople = currentBill.totalGroupPeople;
  const lastTotalPeople = lastBill.totalGroupPeople;
  
  const currentTotalValue = currentBill.totalGroupValue;
  const lastTotalValue = lastBill.totalGroupValue;
  
  // Insights sobre mudança no número de pessoas
  const peopleChange = currentTotalPeople - lastTotalPeople;
  if (peopleChange > 0) {
    insights.push(`Aumento de ${peopleChange} pessoa(s) no grupo em relação ao mês anterior.`);
  } else if (peopleChange < 0) {
    insights.push(`Redução de ${Math.abs(peopleChange)} pessoa(s) no grupo em relação ao mês anterior.`);
  }

  // Insights sobre mudança no valor
  const valueIncrease = ((currentTotalValue - lastTotalValue) / lastTotalValue) * 100;
  if (valueIncrease > 20) {
    insights.push(`Valor da conta ${valueIncrease.toFixed(1)}% maior que o mês anterior.`);
  } else if (valueIncrease < -20) {
    insights.push(`Valor da conta ${Math.abs(valueIncrease).toFixed(1)}% menor que o mês anterior.`);
  }

  // Insights sobre valor per capita
  const currentValuePerPerson = currentTotalPeople > 0 ? currentTotalValue / currentTotalPeople : 0;
  const lastValuePerPerson = lastTotalPeople > 0 ? lastTotalValue / lastTotalPeople : 0;
  
  if (lastValuePerPerson > 0) {
    const perCapitaChange = ((currentValuePerPerson - lastValuePerPerson) / lastValuePerPerson) * 100;
    if (Math.abs(perCapitaChange) > 15) {
      insights.push(`Valor per capita ${perCapitaChange > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(perCapitaChange).toFixed(1)}%.`);
    }
  }

  return insights;
};

/**
 * Calcula estatísticas do histórico de contas de água para um grupo específico
 */
export const calculateWaterStats = (bills: WaterBill[], groupId: string) => {
  // Filtrar apenas contas do grupo específico
  const groupBills = bills.filter(bill => bill.groupId === groupId);
  
  if (groupBills.length === 0) {
    return {
      averageValue: 0,
      averagePeople: 0,
      averageValuePerPerson: 0,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      monthlyVariation: 0
    };
  }

  const totalValue = groupBills.reduce((sum, bill) => sum + bill.totalGroupValue, 0);
  const totalPeople = groupBills.reduce((sum, bill) => sum + bill.totalGroupPeople, 0);
  const averageValue = totalValue / groupBills.length;
  const averagePeople = totalPeople / groupBills.length;
  const averageValuePerPerson = averagePeople > 0 ? averageValue / averagePeople : 0;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let monthlyVariation = 0;

  if (groupBills.length >= 2) {
    const recent = groupBills.slice(-3); // Últimos 3 meses
    const older = groupBills.slice(-6, -3); // 3 meses anteriores

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, bill) => sum + bill.totalGroupValue, 0) / recent.length;
      const olderAvg = older.reduce((sum, bill) => sum + bill.totalGroupValue, 0) / older.length;
      
      monthlyVariation = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      
      if (monthlyVariation > 5) trend = 'increasing';
      else if (monthlyVariation < -5) trend = 'decreasing';
    }
  }

  return {
    averageValue,
    averagePeople,
    averageValuePerPerson,
    trend,
    monthlyVariation
  };
};

/**
 * Exporta dados de água para CSV
 */
export const exportWaterDataToCSV = (bills: WaterBill[], groupId?: string): string => {
  const filteredBills = groupId ? bills.filter(bill => bill.groupId === groupId) : bills;
  
  const headers = [
    'Data',
    'Grupo',
    'Valor Total',
    'Total Pessoas',
    'Valor per Capita',
    'Unidade',
    'Inquilino',
    'Pessoas na Unidade',
    'Valor Proporcional',
    'Status Pagamento',
    'Data Vencimento',
    'Observações'
  ];

  const rows = filteredBills.flatMap(bill => 
    bill.propertiesInGroup.map(prop => [
      new Date(bill.date).toLocaleDateString('pt-BR'),
      bill.groupName,
      bill.totalGroupValue.toFixed(2),
      bill.totalGroupPeople.toString(),
      bill.totalGroupPeople > 0 ? (bill.totalGroupValue / bill.totalGroupPeople).toFixed(2) : '0.00',
      prop.name,
      prop.tenantName || 'N/A',
      prop.numberOfPeople.toString(),
      prop.proportionalValue.toFixed(2),
      prop.isPaid ? 'Pago' : 'Pendente',
      prop.dueDate ? new Date(prop.dueDate).toLocaleDateString('pt-BR') : 'N/A',
      bill.observations || 'N/A'
    ])
  );

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};